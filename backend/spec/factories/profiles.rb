FactoryBot.define do
  factory :profile do
    association :user
    display_name { Faker::Name.name }
    bio          { Faker::Lorem.sentence }
    age          { rand(20..35) }
    gender       { %w[male female other].sample }
    location     { Faker::Address.city }
    personality  { 'friendly' }
    mbti         { %w[ENFP INTJ ISFJ ENTJ].sample }
    interests    { %w[music travel food gaming reading].sample(3) }
  end
end
