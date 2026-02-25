class ApplicationController < ActionController::API
  before_action :authenticate_user!

  private

  def authenticate_user!
    token = request.headers["Authorization"]&.split(" ")&.last
    unless token
      render json: { error: "Unauthorized" }, status: :unauthorized and return
    end

    @current_user = Auth::TokenService.extract_user_from_token(token)
    unless @current_user
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  def skip_authentication
    # before_action :authenticate_user! をスキップするためのno-op
  end
end
