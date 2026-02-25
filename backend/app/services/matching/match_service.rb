module Matching
  class MatchService
    def self.create_like(from_user, to_user)
      like = Like.create!(from_user: from_user, to_user: to_user)

      # 相互いいねをチェック
      reverse_like = Like.find_by(from_user: to_user, to_user: from_user)

      if reverse_like
        # マッチング成立
        match = create_match(from_user, to_user)
        { like: like, is_match: true, match: match }
      else
        { like: like, is_match: false }
      end
    end

    def self.create_match(user1, user2)
      # user_id_1 は常に小さい方にする（重複防止）
      id1, id2 = [ user1.id, user2.id ].sort

      compatibility_score = CompatibilityService.new(user1, user2).calculate_score

      Match.create!(
        user_id_1: id1,
        user_id_2: id2,
        status: "matched",
        matched_at: Time.current,
        compatibility_score: compatibility_score
      )
    end
  end
end
