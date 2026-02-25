FactoryBot.define do
  factory :message do
    association :conversation
    association :sender, factory: :user
    message_type { 'text' }
    content      { Faker::Lorem.sentence }
  end
end
