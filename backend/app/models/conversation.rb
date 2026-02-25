class Conversation < ApplicationRecord
  belongs_to :match
  has_many :messages, dependent: :destroy
  has_one :ar_session, dependent: :destroy

  STATUSES = %w[active ended].freeze

  validates :status, inclusion: { in: STATUSES }

  scope :active, -> { where(status: "active") }
end
