module Matching
  class DiscoveryService
    def initialize(user)
      @user = user
      @profile = user.profile
    end

    def find_candidates(filters = {})
      age_min = filters[:age_min] || 18
      age_max = filters[:age_max] || 100
      gender = filters[:gender]
      limit = filters[:limit] || 10

      # 既にいいね済み、マッチ済みのユーザーを除外
      excluded_user_ids = excluded_users

      query = User.joins(:profile)
                  .where.not(id: excluded_user_ids)
                  .where.not(id: @user.id)
                  .where('profiles.age BETWEEN ? AND ?', age_min, age_max)

      query = query.where('profiles.gender = ?', gender) if gender.present?

      candidates = query.limit(limit * 2).to_a

      # 相性スコアを計算してソート
      scored_candidates = candidates.map do |candidate|
        score = CompatibilityService.new(@user, candidate).calculate_score
        { user: candidate, profile: candidate.profile, compatibility_score: score }
      end

      scored_candidates.sort_by { |c| -c[:compatibility_score] }.take(limit)
    end

    private

    def excluded_users
      liked_ids = @user.sent_likes.pluck(:to_user_id)
      matched_ids = Match.where('user_id_1 = ? OR user_id_2 = ?', @user.id, @user.id)
                         .where(status: 'matched')
                         .pluck(:user_id_1, :user_id_2)
                         .flatten
                         .uniq
                         .reject { |id| id == @user.id }

      (liked_ids + matched_ids + [@user.id]).uniq
    end
  end
end
