require 'rails_helper'

RSpec.describe 'Api::V1::Profiles', type: :request do
  let(:user)    { create(:user) }
  let(:profile) { create(:profile, user: user) }

  describe 'GET /api/v1/profiles/:id' do
    it '200とプロフィールを返す' do
      get "/api/v1/profiles/#{profile.id}", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['profile']['display_name']).to eq(profile.display_name)
    end

    it '存在しないIDで404を返す' do
      get '/api/v1/profiles/0', headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'PATCH /api/v1/profiles/:id' do
    context '本人が更新' do
      it '200と更新後プロフィールを返す' do
        patch "/api/v1/profiles/#{profile.id}",
              params: { display_name: '新しい名前', bio: '更新されました' },
              headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['profile']['display_name']).to eq('新しい名前')
        expect(profile.reload.display_name).to eq('新しい名前')
      end
    end

    context '他人のプロフィールを更新' do
      let(:other_user)    { create(:user) }
      let(:other_profile) { create(:profile, user: other_user) }

      it '403を返す' do
        patch "/api/v1/profiles/#{other_profile.id}",
              params: { display_name: '不正な更新' },
              headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'バリデーションエラー' do
      it '422を返す' do
        patch "/api/v1/profiles/#{profile.id}",
              params: { display_name: '' },
              headers: auth_headers(user)
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe 'POST /api/v1/profiles/:id/avatar' do
    let(:s3_service) { instance_double(Storage::S3Service) }

    before do
      allow(Storage::S3Service).to receive(:new).and_return(s3_service)
      allow(s3_service).to receive(:upload).and_return('https://cdn.example.com/avatars/test.jpg')
    end

    it 'アバターURLを更新して返す' do
      file = fixture_file_upload(Rails.root.join('spec/fixtures/test_image.jpg'), 'image/jpeg')
      post "/api/v1/profiles/#{profile.id}/avatar",
           params: { avatar: file },
           headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['avatar_url']).to eq('https://cdn.example.com/avatars/test.jpg')
    end

    it 'ファイルなしで400を返す' do
      post "/api/v1/profiles/#{profile.id}/avatar", headers: auth_headers(user)
      expect(response).to have_http_status(:bad_request)
    end
  end
end
