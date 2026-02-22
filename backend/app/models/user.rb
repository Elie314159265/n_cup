class User < ApplicationRecord
  has_one :profile, dependent: :destroy
  has_many :ar_avatars, dependent: :destroy
  has_many :sent_likes, class_name: 'Like', foreign_key: 'from_user_id', dependent: :destroy
  has_many :received_likes, class_name: 'Like', foreign_key: 'to_user_id', dependent: :destroy
  has_many :sent_messages, class_name: 'Message', foreign_key: 'sender_id', dependent: :destroy

  validates :cognito_sub, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, presence: true, uniqueness: true, length: { maximum: 50 }
end
