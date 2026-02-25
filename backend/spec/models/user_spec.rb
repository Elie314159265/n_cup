require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'バリデーション' do
    it '有効なファクトリー' do
      expect(build(:user)).to be_valid
    end

    it 'cognito_subが必須' do
      expect(build(:user, cognito_sub: nil)).not_to be_valid
    end

    it 'emailが必須' do
      expect(build(:user, email: nil)).not_to be_valid
    end

    it 'emailの形式チェック' do
      expect(build(:user, email: 'invalid')).not_to be_valid
    end

    it 'usernameが必須' do
      expect(build(:user, username: nil)).not_to be_valid
    end

    it 'usernameは50文字以内' do
      expect(build(:user, username: 'a' * 51)).not_to be_valid
    end

    it 'cognito_subは一意' do
      create(:user, cognito_sub: 'dup-sub')
      expect(build(:user, cognito_sub: 'dup-sub')).not_to be_valid
    end

    it 'emailは一意' do
      create(:user, email: 'dup@example.com')
      expect(build(:user, email: 'dup@example.com')).not_to be_valid
    end
  end

  describe 'アソシエーション' do
    it 'profileを持つ' do
      user = create(:user)
      profile = create(:profile, user: user)
      expect(user.profile).to eq(profile)
    end

    it 'userを削除するとprofileも削除される' do
      user = create(:user)
      create(:profile, user: user)
      expect { user.destroy }.to change(Profile, :count).by(-1)
    end
  end
end
