class ArSession < ApplicationRecord
  belongs_to :conversation

  validates :session_token, presence: true, uniqueness: true
  validates :environment_type, presence: true

  before_create :generate_session_token

  private

  def generate_session_token
    self.session_token ||= "sess_#{SecureRandom.hex(16)}"
  end
end
