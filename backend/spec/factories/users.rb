FactoryBot.define do
  factory :user do
    sequence(:cognito_sub) { |n| "cognito-sub-#{n}" }
    sequence(:email)       { |n| "user#{n}@example.com" }
    sequence(:username)    { |n| "user#{n}" }
  end
end
