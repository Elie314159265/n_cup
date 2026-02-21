class ArAvatar < ApplicationRecord
  belongs_to :user
  has_one :profile

  validates :name, presence: true, length: { maximum: 100 }
  validates :model_url, presence: true, length: { maximum: 500 }
  validates :texture_url, length: { maximum: 500 }, allow_nil: true
  validates :voice_id, length: { maximum: 50 }, allow_nil: true
end
