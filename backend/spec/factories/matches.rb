FactoryBot.define do
  factory :match do
    association :user_1, factory: :user
    association :user_2, factory: :user
    status              { 'matched' }
    matched_at          { Time.current }
    compatibility_score { rand(50..100) }

    # user_id_1 < user_id_2 を保証
    after(:build) do |match|
      if match.user_1.id && match.user_2.id && match.user_1.id > match.user_2.id
        match.user_id_1, match.user_id_2 = match.user_id_2, match.user_id_1
      end
    end
  end
end
