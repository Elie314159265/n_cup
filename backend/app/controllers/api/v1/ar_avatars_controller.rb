module Api
  module V1
    class ArAvatarsController < ApplicationController
      before_action :set_ar_avatar, only: [:show, :update, :destroy, :upload_model]
      before_action :authorize_owner!, only: [:update, :destroy, :upload_model]

      # GET /api/v1/ar_avatars
      def index
        avatars = current_user.ar_avatars
        render json: { ar_avatars: avatars.map { |a| avatar_json(a) } }
      end

      # POST /api/v1/ar_avatars
      def create
        avatar = current_user.ar_avatars.create!(avatar_params)
        render json: { ar_avatar: avatar_json(avatar) }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      # GET /api/v1/ar_avatars/:id
      def show
        render json: { ar_avatar: avatar_json(@ar_avatar) }
      end

      # PATCH /api/v1/ar_avatars/:id
      def update
        if @ar_avatar.update(avatar_params)
          render json: { ar_avatar: avatar_json(@ar_avatar) }
        else
          render json: { errors: @ar_avatar.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/ar_avatars/:id
      def destroy
        @ar_avatar.destroy!
        render json: { message: 'AR Avatar deleted' }
      end

      # POST /api/v1/ar_avatars/:id/upload_model
      def upload_model
        unless params[:model_file]
          return render json: { error: 'Model file is required' }, status: :bad_request
        end

        s3_service = Storage::S3Service.new
        key = "ar_models/#{current_user.id}/#{SecureRandom.uuid}#{File.extname(params[:model_file].original_filename)}"
        model_url = s3_service.upload(key, params[:model_file].read, content_type: params[:model_file].content_type)

        if model_url && @ar_avatar.update(model_url: model_url)
          render json: { model_url: model_url }
        else
          render json: { error: 'Model upload failed' }, status: :internal_server_error
        end
      end

      private

      def set_ar_avatar
        @ar_avatar = ArAvatar.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'AR Avatar not found' }, status: :not_found
      end

      def authorize_owner!
        unless @ar_avatar.user == current_user
          render json: { error: 'Forbidden' }, status: :forbidden
        end
      end

      def avatar_params
        params.permit(:name, :model_url, :texture_url, :voice_id, animation_data: {}, customization: {})
      end

      def avatar_json(avatar)
        {
          id: avatar.id,
          user_id: avatar.user_id,
          name: avatar.name,
          model_url: avatar.model_url,
          texture_url: avatar.texture_url,
          voice_id: avatar.voice_id,
          animation_data: avatar.animation_data,
          customization: avatar.customization,
          created_at: avatar.created_at,
          updated_at: avatar.updated_at
        }
      end
    end
  end
end
