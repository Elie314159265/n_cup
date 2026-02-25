module Api
  module V1
    class UsersController < ApplicationController
      before_action :set_user

      # GET /api/v1/users/:id
      def show
        render json: { user: user_json(@user) }
      end

      # PATCH /api/v1/users/:id
      def update
        unless @user == current_user
          return render json: { error: 'Forbidden' }, status: :forbidden
        end

        if @user.update(user_params)
          render json: { user: user_json(@user) }
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_user
        @user = User.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'User not found' }, status: :not_found
      end

      def user_params
        params.permit(:username)
      end

      def user_json(user)
        {
          id: user.id,
          email: user.email,
          username: user.username,
          profile: user.profile ? profile_json(user.profile) : nil,
          created_at: user.created_at
        }
      end

      def profile_json(profile)
        {
          id: profile.id,
          display_name: profile.display_name,
          bio: profile.bio,
          age: profile.age,
          gender: profile.gender,
          location: profile.location,
          avatar_url: profile.avatar_url,
          cup_size: profile.cup_size,
          personality: profile.personality,
          mbti: profile.mbti,
          interests: profile.interests
        }
      end
    end
  end
end
