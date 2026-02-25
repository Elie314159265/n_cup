FactoryBot.define do
  factory :conversation do
    association :match
    status     { 'active' }
    started_at { Time.current }
  end
end
