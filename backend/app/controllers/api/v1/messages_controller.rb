module Api
  module V1
    class MessagesController < ApplicationController
      before_action :set_conversation, only: [:index, :create]

      # GET /api/v1/conversations/:conversation_id/messages
      def index
        messages = @conversation.messages
                                .includes(:sender)
                                .order(created_at: :asc)

        render json: { messages: messages.map { |m| message_json(m) } }
      end

      # POST /api/v1/conversations/:conversation_id/messages
      def create
        unless @conversation.status == 'active'
          return render json: { error: 'Conversation is ended' }, status: :unprocessable_entity
        end

        message = @conversation.messages.create!(
          sender: current_user,
          message_type: params[:message_type] || 'text',
          content: params[:content],
          metadata: params[:metadata]
        )

        # Action Cable でリアルタイム配信
        ActionCable.server.broadcast(
          "conversation_#{@conversation.id}",
          { type: 'new_message', message: message_json(message) }
        )

        render json: { message: message_json(message) }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      # PATCH /api/v1/messages/:id/read
      def mark_as_read
        message = Message.find(params[:id])

        unless message.conversation.match.user_1 == current_user ||
               message.conversation.match.user_2 == current_user
          return render json: { error: 'Forbidden' }, status: :forbidden
        end

        message.update!(read_at: Time.current)
        render json: { message: message_json(message) }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Message not found' }, status: :not_found
      end

      private

      def set_conversation
        match_ids = Match.where('user_id_1 = ? OR user_id_2 = ?', current_user.id, current_user.id).pluck(:id)
        @conversation = Conversation.where(match_id: match_ids).find(params[:conversation_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Conversation not found' }, status: :not_found
      end

      def message_json(message)
        {
          id: message.id,
          conversation_id: message.conversation_id,
          sender_id: message.sender_id,
          sender_username: message.sender.username,
          message_type: message.message_type,
          content: message.content,
          metadata: message.metadata,
          read_at: message.read_at,
          created_at: message.created_at
        }
      end
    end
  end
end
