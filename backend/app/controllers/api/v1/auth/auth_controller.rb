module Api
  module V1
    module Auth
      class AuthController < ApplicationController
        skip_before_action :authenticate_user!, only: [ :signup, :signin, :refresh ]

        # POST /api/v1/auth/signup
        def signup
          cognito_service = ::Auth::CognitoService.new
          result = cognito_service.sign_up(
            email: params[:email],
            password: params[:password],
            username: params[:username]
          )

          user = User.create!(
            cognito_sub: result[:user_sub],
            email: params[:email],
            username: params[:username]
          )

          render json: {
            user: user_json(user),
            message: "Signup successful. Please check your email for verification."
          }, status: :created
        rescue Aws::CognitoIdentityProvider::Errors::UsernameExistsException
          render json: { error: "Email already registered" }, status: :unprocessable_entity
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: e.message }, status: :unprocessable_entity
        rescue => e
          Rails.logger.error("Signup error: #{e.message}")
          render json: { error: "Signup failed" }, status: :internal_server_error
        end

        # POST /api/v1/auth/signin
        def signin
          cognito_service = ::Auth::CognitoService.new
          result = cognito_service.sign_in(
            email: params[:email],
            password: params[:password]
          )

          user = User.find_by(email: params[:email])
          unless user
            return render json: { error: "User not found" }, status: :not_found
          end

          render json: {
            user: user_json(user),
            tokens: {
              id_token: result[:id_token],
              access_token: result[:access_token],
              refresh_token: result[:refresh_token],
              expires_in: result[:expires_in]
            }
          }
        rescue Aws::CognitoIdentityProvider::Errors::NotAuthorizedException
          render json: { error: "Invalid email or password" }, status: :unauthorized
        rescue Aws::CognitoIdentityProvider::Errors::UserNotConfirmedException
          render json: { error: "Email not verified" }, status: :forbidden
        rescue => e
          Rails.logger.error("Signin error: #{e.message}")
          render json: { error: "Signin failed" }, status: :internal_server_error
        end

        # POST /api/v1/auth/signout
        def signout
          render json: { message: "Signed out successfully" }
        end

        # POST /api/v1/auth/refresh
        def refresh
          refresh_token = params[:refresh_token]
          unless refresh_token
            return render json: { error: "Refresh token is required" }, status: :bad_request
          end

          cognito_service = ::Auth::CognitoService.new
          result = cognito_service.refresh_token(refresh_token)

          render json: {
            tokens: {
              id_token: result[:id_token],
              access_token: result[:access_token],
              expires_in: result[:expires_in]
            }
          }
        rescue => e
          Rails.logger.error("Token refresh error: #{e.message}")
          render json: { error: "Token refresh failed" }, status: :unauthorized
        end

        # GET /api/v1/auth/me
        def me
          render json: { user: user_json(current_user) }
        end

        private

        def user_json(user)
          {
            id: user.id,
            email: user.email,
            username: user.username,
            has_profile: user.profile.present?,
            created_at: user.created_at
          }
        end
      end
    end
  end
end
