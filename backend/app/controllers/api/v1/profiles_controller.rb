module Api
  module V1
    class ProfilesController < ApplicationController
      before_action :set_profile, only: [ :show, :update, :upload_avatar ]
      before_action :authorize_owner!, only: [ :update, :upload_avatar ]

      # POST /api/v1/profiles
      def create
        if current_user.profile.present?
          return render json: { error: "Profile already exists" }, status: :unprocessable_entity
        end

        @profile = current_user.build_profile(profile_params)
        if @profile.save
          render json: { profile: profile_json(@profile) }, status: :created
        else
          render json: { errors: @profile.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/profiles/:id
      def show
        render json: { profile: profile_json(@profile) }
      end

      # PATCH /api/v1/profiles/:id
      def update
        if @profile.update(profile_params)
          render json: { profile: profile_json(@profile) }
        else
          render json: { errors: @profile.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/profiles/:id/avatar
      def upload_avatar
        unless params[:avatar]
          return render json: { error: "Avatar file is required" }, status: :bad_request
        end

        s3_service = Storage::S3Service.new
        key = "avatars/#{current_user.id}/#{SecureRandom.uuid}#{File.extname(params[:avatar].original_filename)}"
        avatar_url = s3_service.upload(key, params[:avatar].read, content_type: params[:avatar].content_type)

        if avatar_url && @profile.update(avatar_url: avatar_url)
          render json: { avatar_url: avatar_url }
        else
          render json: { error: "Avatar upload failed" }, status: :internal_server_error
        end
      end

      private

      def set_profile
        @profile = Profile.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Profile not found" }, status: :not_found
      end

      def authorize_owner!
        unless @profile.user == current_user
          render json: { error: "Forbidden" }, status: :forbidden
        end
      end

      def profile_params
        params.permit(
          :display_name, :bio, :age, :gender, :location,
          :cup_size, :personality, :mbti, :ar_avatar_id,
          interests: [], preferences: {}
        )
      end

      def profile_json(profile)
        {
          id: profile.id,
          user_id: profile.user_id,
          display_name: profile.display_name,
          bio: profile.bio,
          age: profile.age,
          gender: profile.gender,
          location: profile.location,
          avatar_url: profile.avatar_url,
          cup_size: profile.cup_size,
          personality: profile.personality,
          mbti: profile.mbti,
          interests: profile.interests,
          preferences: profile.preferences,
          ar_avatar_id: profile.ar_avatar_id,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }
      end
    end
  end
end
