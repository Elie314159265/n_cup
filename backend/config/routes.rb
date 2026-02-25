Rails.application.routes.draw do
  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # API v1
  namespace :api do
    namespace :v1 do
      # Authentication
      namespace :auth do
        post "signup", to: "auth#signup"
        post "signin", to: "auth#signin"
        post "signout", to: "auth#signout"
        post "refresh", to: "auth#refresh"
        get "me", to: "auth#me"
      end

      # Users
      resources :users, only: [ :show, :update ]

      # Profiles
      resources :profiles, only: [ :create, :show, :update ] do
        member do
          post "avatar", to: "profiles#upload_avatar"
        end
      end

      # AR Avatars
      resources :ar_avatars do
        member do
          post "upload_model", to: "ar_avatars#upload_model"
        end
      end

      # Matching
      get "discover", to: "matching#discover"
      resources :likes, only: [ :create, :index ] do
        collection do
          get "received"
        end
      end
      resources :matches, only: [ :index, :destroy ]

      # Conversations & Messages
      resources :conversations, only: [ :index, :create, :show ] do
        member do
          post "end", to: "conversations#end_conversation"
        end
        resources :messages, only: [ :index, :create ]
      end
      resources :messages, only: [] do
        member do
          patch "read", to: "messages#mark_as_read"
        end
      end

      # AR Sessions
      resources :ar_sessions, only: [ :create, :show, :update ] do
        member do
          post "join"
          post "leave"
        end
      end

      # AI Services
      post "ai/chat", to: "ai#chat"
      post "ai/speech", to: "ai#speech"
      post "ai/transcribe", to: "ai#transcribe"
      get "ai/transcribe/:job_name", to: "ai#transcribe_result"
    end
  end

  # Action Cable endpoint
  mount ActionCable.server => "/cable"
end
