require 'rails_helper'

RSpec.describe Like, type: :model do
  describe 'バリデーション' do
    it '有効なファクトリー' do
      expect(build(:like)).to be_valid
    end

    it '同じペアへの重複いいねは無効' do
      like = create(:like)
      expect(build(:like, from_user: like.from_user, to_user: like.to_user)).not_to be_valid
    end

    it '自分自身へのいいねは無効' do
      user = create(:user)
      expect(build(:like, from_user: user, to_user: user)).not_to be_valid
    end
  end
end
