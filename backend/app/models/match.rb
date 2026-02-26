class Match < ApplicationRecord
  belongs_to :user_1, class_name: "User", foreign_key: "user_id_1"
  belongs_to :user_2, class_name: "User", foreign_key: "user_id_2"
  has_many :conversations, dependent: :destroy

  STATUSES = %w[pending matched rejected].freeze

  validates :user_id_1, uniqueness: { scope: :user_id_2 }
  validates :status, inclusion: { in: STATUSES }
  validates :compatibility_score, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true

  scope :matched, -> { where(status: "matched") }
  scope :pending, -> { where(status: "pending") }
end
