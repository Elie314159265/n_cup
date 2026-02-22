class Message < ApplicationRecord
  belongs_to :conversation
  belongs_to :sender, class_name: 'User'

  MESSAGE_TYPES = %w[text image voice ar_action ai_response].freeze

  validates :message_type, inclusion: { in: MESSAGE_TYPES }
  validates :content, presence: true, if: -> { message_type == 'text' }

  scope :unread, -> { where(read_at: nil) }
end
