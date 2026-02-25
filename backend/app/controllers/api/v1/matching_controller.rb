module Api
  module V1
    class MatchingController < ApplicationController
      # GET /api/v1/discover
      def discover
        unless current_user.profile
          return render json: { error: 'Please complete your profile first' }, status: :unprocessable_entity
        end

        filters = {
          age_min: params[:age_min]&.to_i,
          age_max: params[:age_max]&.to_i,
          gender: params[:gender],
          limit: params[:limit]&.to_i || 10
        }.compact

        candidates = Matching::DiscoveryService.new(current_user).find_candidates(filters)

        render json: {
          candidates: candidates.map { |c| candidate_json(c) }
        }
      end

      private

      def candidate_json(candidate)
        profile = candidate[:profile]
        {
          user_id: candidate[:user].id,
          compatibility_score: candidate[:compatibility_score],
          profile: {
            display_name: profile.display_name,
            age: profile.age,
            gender: profile.gender,
            location: profile.location,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            personality: profile.personality,
            mbti: profile.mbti,
            interests: profile.interests
          }
        }
      end
    end
  end
end
