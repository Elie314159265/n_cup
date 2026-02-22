class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :cognito_sub, null: false, index: { unique: true }
      t.string :email, null: false, index: { unique: true }
      t.string :username, null: false, limit: 50, index: { unique: true }

      t.timestamps
    end
  end
end
