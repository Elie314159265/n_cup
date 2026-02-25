FactoryBot.define do
  factory :ar_session do
    association :conversation
    environment_type { 'default' }
  end
end
