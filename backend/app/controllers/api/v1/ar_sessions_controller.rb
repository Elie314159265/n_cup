module Api
  module V1
    class ArSessionsController < ApplicationController
      before_action :set_ar_session, only: [ :show, :update, :join, :leave ]

      # POST /api/v1/ar_sessions
      def create
        conversation = Conversation.find(params[:conversation_id])

        unless conversation.match.user_1 == current_user || conversation.match.user_2 == current_user
          return render json: { error: "Forbidden" }, status: :forbidden
        end

        if conversation.ar_session.present?
          return render json: { error: "AR session already exists for this conversation" }, status: :unprocessable_entity
        end

        ar_session = ArSession.create!(
          conversation: conversation,
          environment_type: params[:environment_type] || "default",
          environment_data: params[:environment_data]
        )

        # Action Cable で参加者に通知
        ActionCable.server.broadcast(
          "conversation_#{conversation.id}",
          { type: "ar_session_started", session_token: ar_session.session_token }
        )

        render json: { ar_session: session_json(ar_session) }, status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Conversation not found" }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      # GET /api/v1/ar_sessions/:id
      def show
        render json: { ar_session: session_json(@ar_session) }
      end

      # PATCH /api/v1/ar_sessions/:id
      def update
        if @ar_session.update(session_params)
          render json: { ar_session: session_json(@ar_session) }
        else
          render json: { errors: @ar_session.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/ar_sessions/:id/join
      def join
        ActionCable.server.broadcast(
          "conversation_#{@ar_session.conversation_id}",
          { type: "user_joined_ar", user_id: current_user.id, username: current_user.username }
        )

        render json: {
          ar_session: session_json(@ar_session),
          message: "Joined AR session"
        }
      end

      # POST /api/v1/ar_sessions/:id/leave
      def leave
        ActionCable.server.broadcast(
          "conversation_#{@ar_session.conversation_id}",
          { type: "user_left_ar", user_id: current_user.id, username: current_user.username }
        )

        render json: { message: "Left AR session" }
      end

      private

      def set_ar_session
        @ar_session = ArSession.find(params[:id])
        conversation = @ar_session.conversation
        unless conversation.match.user_1 == current_user || conversation.match.user_2 == current_user
          render json: { error: "Forbidden" }, status: :forbidden
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "AR session not found" }, status: :not_found
      end

      def session_params
        params.permit(:environment_type, environment_data: {})
      end

      def session_json(ar_session)
        {
          id: ar_session.id,
          conversation_id: ar_session.conversation_id,
          session_token: ar_session.session_token,
          environment_type: ar_session.environment_type,
          environment_data: ar_session.environment_data,
          created_at: ar_session.created_at
        }
      end
    end
  end
end
