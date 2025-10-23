interface Window {
  Pylon: (
    command: 'show' | 'hide' | 'hideChatBubble' | 'showChatBubble' | 'onShow' | 'onHide' | 'onChangeUnreadMessagesCount' | 'setNewIssueCustomFields' | 'setTicketFormFields' | 'showNewMessage' | 'showTicketForm' | 'showKnowledgeBaseArticle',
    arg?: unknown,
    options?: { isHtml?: boolean }
  ) => void;
}
