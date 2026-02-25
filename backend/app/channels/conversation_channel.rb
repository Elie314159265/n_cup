class ConversationChannel < ApplicationCable::Channel
  def subscribed
    conversation = find_authorized_conversation
    if conversation
      stream_from "conversation_#{conversation.id}"
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
  end

  # クライアントからのメッセージ送信
  def send_message(data)
    conversation = find_authorized_conversation
    return unless conversation
    return unless conversation.status == 'active'

    message = conversation.messages.create!(
      sender: current_user,
      message_type: data['message_type'] || 'text',
      content: data['content'],
      metadata: data['metadata']
    )

    ActionCable.server.broadcast(
      "conversation_#{conversation.id}",
      {
        type: 'new_message',
        message: {
          id: message.id,
          sender_id: message.sender_id,
          sender_username: current_user.username,
          message_type: message.message_type,
          content: message.content,
          metadata: message.metadata,
          created_at: message.created_at
        }
      }
    )
  end

  # AR セッション中の位置情報・アクション同期
  def sync_ar_action(data)
    conversation = find_authorized_conversation
    return unless conversation

    ActionCable.server.broadcast(
      "conversation_#{conversation.id}",
      {
        type: 'ar_action',
        user_id: current_user.id,
        action: data['action'],
        payload: data['payload']
      }
    )
  end

  private

  def find_authorized_conversation
    conversation_id = params[:conversation_id]
    return nil unless conversation_id

    match_ids = Match.where('user_id_1 = ? OR user_id_2 = ?', current_user.id, current_user.id).pluck(:id)
    Conversation.where(match_id: match_ids).find_by(id: conversation_id)
  end
end
