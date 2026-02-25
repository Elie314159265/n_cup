module Api
  module V1
    class ConversationsController < ApplicationController
      before_action :set_conversation, only: [ :show, :end_conversation ]

      # GET /api/v1/conversations
      def index
        match_ids = Match.where("user_id_1 = ? OR user_id_2 = ?", current_user.id, current_user.id)
                         .pluck(:id)

        conversations = Conversation.where(match_id: match_ids)
                                    .includes(match: [ :user_1, :user_2 ])
                                    .order(created_at: :desc)

        render json: { conversations: conversations.map { |c| conversation_json(c) } }
      end

      # POST /api/v1/conversations
      def create
        match = Match.find(params[:match_id])

        unless match.user_1 == current_user || match.user_2 == current_user
          return render json: { error: "Forbidden" }, status: :forbidden
        end

        unless match.status == "matched"
          return render json: { error: "Match is not active" }, status: :unprocessable_entity
        end

        conversation = Conversation.create!(
          match: match,
          status: "active",
          started_at: Time.current
        )

        render json: { conversation: conversation_json(conversation) }, status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Match not found" }, status: :not_found
      end

      # GET /api/v1/conversations/:id
      def show
        render json: { conversation: conversation_json(@conversation, include_messages: true) }
      end

      # POST /api/v1/conversations/:id/end
      def end_conversation
        unless @conversation.status == "active"
          return render json: { error: "Conversation is already ended" }, status: :unprocessable_entity
        end

        @conversation.update!(status: "ended", ended_at: Time.current)
        render json: { conversation: conversation_json(@conversation) }
      end

      private

      def set_conversation
        match_ids = Match.where("user_id_1 = ? OR user_id_2 = ?", current_user.id, current_user.id).pluck(:id)
        @conversation = Conversation.where(match_id: match_ids).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Conversation not found" }, status: :not_found
      end

      def conversation_json(conversation, include_messages: false)
        match = conversation.match
        partner = match.user_1 == current_user ? match.user_2 : match.user_1

        data = {
          id: conversation.id,
          match_id: conversation.match_id,
          status: conversation.status,
          started_at: conversation.started_at,
          ended_at: conversation.ended_at,
          partner: {
            id: partner.id,
            username: partner.username,
            display_name: partner.profile&.display_name,
            avatar_url: partner.profile&.avatar_url
          },
          ar_session: conversation.ar_session ? ar_session_summary(conversation.ar_session) : nil
        }

        if include_messages
          data[:messages] = conversation.messages.order(created_at: :asc).map { |m| message_json(m) }
        end

        data
      end

      def ar_session_summary(ar_session)
        { id: ar_session.id, session_token: ar_session.session_token, environment_type: ar_session.environment_type }
      end

      def message_json(message)
        {
          id: message.id,
          sender_id: message.sender_id,
          message_type: message.message_type,
          content: message.content,
          read_at: message.read_at,
          created_at: message.created_at
        }
      end
    end
  end
end
