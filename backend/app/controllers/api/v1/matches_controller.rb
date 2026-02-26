module Api
  module V1
    class MatchesController < ApplicationController
      # GET /api/v1/matches
      def index
        matches = Match.where("user_id_1 = ? OR user_id_2 = ?", current_user.id, current_user.id)
                       .where(status: "matched")
                       .includes(user_1: :profile, user_2: :profile)
                       .order(matched_at: :desc)

        render json: { matches: matches.map { |m| match_json(m) } }
      end

      # DELETE /api/v1/matches/:id
      def destroy
        match = Match.find(params[:id])

        unless match.user_1 == current_user || match.user_2 == current_user
          return render json: { error: "Forbidden" }, status: :forbidden
        end

        match.update!(status: "rejected")
        render json: { message: "Match removed" }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Match not found" }, status: :not_found
      end

      private

      def match_json(match)
        partner = match.user_1 == current_user ? match.user_2 : match.user_1
        profile = partner.profile
        {
          id: match.id,
          compatibility_score: match.compatibility_score,
          matched_at: match.matched_at,
          partner: {
            id: partner.id,
            username: partner.username,
            display_name: profile&.display_name,
            avatar_url: profile&.avatar_url,
            age: profile&.age,
            gender: profile&.gender,
            location: profile&.location
          }
        }
      end
    end
  end
end
