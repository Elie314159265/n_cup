module Matching
  class CompatibilityService
    def initialize(user1, user2)
      @user1 = user1
      @user2 = user2
      @profile1 = user1.profile
      @profile2 = user2.profile
    end

    def calculate_score
      return 0 unless @profile1 && @profile2

      score = 0

      # 共通の興味 (最大40点)
      score += common_interests_score

      # 年齢差 (最大30点)
      score += age_compatibility_score

      # 性格の相性 (最大30点)
      score += personality_compatibility_score

      score.round
    end

    private

    def common_interests_score
      interests1 = @profile1.interests || []
      interests2 = @profile2.interests || []

      return 0 if interests1.empty? || interests2.empty?

      common_count = (interests1 & interests2).size
      total_unique = (interests1 + interests2).uniq.size

      (common_count.to_f / total_unique * 40).round
    end

    def age_compatibility_score
      age_diff = (@profile1.age - @profile2.age).abs

      if age_diff <= 3
        30
      elsif age_diff <= 5
        25
      elsif age_diff <= 10
        15
      elsif age_diff <= 15
        5
      else
        0
      end
    end

    def personality_compatibility_score
      # シンプルな相性マッピング
      compatibility_map = {
        'friendly' => ['friendly', 'calm', 'cheerful'],
        'calm' => ['calm', 'friendly', 'intellectual'],
        'cheerful' => ['cheerful', 'friendly', 'active'],
        'intellectual' => ['intellectual', 'calm', 'curious'],
        'active' => ['active', 'cheerful', 'adventurous']
      }

      p1 = @profile1.personality
      p2 = @profile2.personality

      return 15 unless p1 && p2

      if p1 == p2
        30
      elsif compatibility_map[p1]&.include?(p2)
        20
      else
        10
      end
    end
  end
end
