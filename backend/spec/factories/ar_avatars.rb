FactoryBot.define do
  factory :ar_avatar do
    association :user
    name      { Faker::Name.name }
    model_url { "https://example.cloudfront.net/models/#{SecureRandom.uuid}.glb" }
    voice_id  { 'Mizuki' }
  end
end
