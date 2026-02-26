require 'rails_helper'

RSpec.describe 'Api::V1::Auth', type: :request do
  let(:cognito_service) { instance_double(Auth::CognitoService) }

  before do
    allow(Auth::CognitoService).to receive(:new).and_return(cognito_service)
  end

  describe 'POST /api/v1/auth/signup' do
    let(:params) { { email: 'new@example.com', password: 'Password1', username: 'newuser' } }

    context '正常系' do
      before do
        allow(cognito_service).to receive(:sign_up).and_return({ user_sub: 'cognito-sub-new', user_confirmed: false })
        allow(cognito_service).to receive(:admin_confirm_sign_up)
        allow(cognito_service).to receive(:sign_in).and_return({
          id_token: 'id_token', access_token: 'access_token',
          refresh_token: 'refresh_token', expires_in: 3600
        })
      end

      it '201を返してユーザーとプロフィールを作成しトークンを含む' do
        post '/api/v1/auth/signup', params: params
        expect(response).to have_http_status(:created)
        body = JSON.parse(response.body)
        expect(body['user']['email']).to eq('new@example.com')
        expect(body['profile_id']).to be_present
        expect(body['id_token']).to eq('id_token')
        expect(body['refresh_token']).to eq('refresh_token')
        user = User.find_by(email: 'new@example.com')
        expect(user).to be_present
        expect(user.profile).to be_present
      end
    end

    context 'Cognitoでメールが重複' do
      before do
        allow(cognito_service).to receive(:sign_up)
          .and_raise(Aws::CognitoIdentityProvider::Errors::UsernameExistsException.new(nil, 'exists'))
      end

      it '422を返す' do
        post '/api/v1/auth/signup', params: params
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe 'POST /api/v1/auth/signin' do
    let(:user) { create(:user) }

    context '正常系' do
      before do
        allow(cognito_service).to receive(:sign_in).and_return({
          id_token: 'id_token', access_token: 'access_token',
          refresh_token: 'refresh_token', expires_in: 3600
        })
      end

      it '200を返してトークンを含む' do
        post '/api/v1/auth/signin', params: { email: user.email, password: 'Password1' }
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['id_token']).to eq('id_token')
        expect(body['user']['email']).to eq(user.email)
      end
    end

    context '認証情報が不正' do
      before do
        allow(cognito_service).to receive(:sign_in)
          .and_raise(Aws::CognitoIdentityProvider::Errors::NotAuthorizedException.new(nil, 'invalid'))
      end

      it '401を返す' do
        post '/api/v1/auth/signin', params: { email: user.email, password: 'wrong' }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'POST /api/v1/auth/refresh' do
    context '正常系' do
      before do
        allow(cognito_service).to receive(:refresh_token).and_return({
          id_token: 'new_id_token', access_token: 'new_access_token', expires_in: 3600
        })
      end

      it '認証なしで200を返す（refresh_tokenのみ使用）' do
        post '/api/v1/auth/refresh', params: { refresh_token: 'valid_refresh_token' }
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['id_token']).to eq('new_id_token')
      end
    end

    it 'refresh_tokenなしで400を返す' do
      post '/api/v1/auth/refresh'
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe 'GET /api/v1/auth/me' do
    let(:user) { create(:user) }

    it '認証済みで200とユーザー情報を返す' do
      get '/api/v1/auth/me', headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['user']['id']).to eq(user.id)
    end

    it '未認証で401を返す' do
      get '/api/v1/auth/me'
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
