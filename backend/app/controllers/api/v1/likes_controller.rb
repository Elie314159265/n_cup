module Api
  module V1
    class LikesController < ApplicationController
      # POST /api/v1/likes
      def create
        to_user = User.find(params[:to_user_id])

        result = Matching::MatchService.create_like(current_user, to_user)

        response_data = { like: { id: result[:like].id, to_user_id: to_user.id }, is_match: result[:is_match] }

        if result[:is_match]
          match = result[:match]
          response_data[:match] = {
            id: match.id,
            compatibility_score: match.compatibility_score,
            matched_at: match.matched_at
          }
        end

        render json: response_data, status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'User not found' }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # GET /api/v1/likes
      def index
        likes = current_user.sent_likes.includes(:to_user => :profile)
        render json: { likes: likes.map { |l| like_json(l) } }
      end

      # GET /api/v1/likes/received
      def received
        likes = current_user.received_likes.includes(:from_user => :profile)
        render json: { likes: likes.map { |l| like_json(l, received: true) } }
      end

      private

      def like_json(like, received: false)
        target = received ? like.from_user : like.to_user
        profile = target.profile
        {
          id: like.id,
          user: {
            id: target.id,
            username: target.username,
            display_name: profile&.display_name,
            avatar_url: profile&.avatar_url
          },
          created_at: like.created_at
        }
      end
    end
  end
end
