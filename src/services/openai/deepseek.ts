import EventSource from 'react-native-sse';

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;

const systemPrompt =
  '你是一名英语专家，你的任务是帮助用户学习英语，回答用户的各种英语问题，例如句子语法结构分析。根据用户的上下文提供清晰、简明的解释和示例。';

export const getCompletionStream = async (prompt: string, onData: (data: string) => void) => {
  const eventSource = new EventSource(DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true,
    }),
  });

  eventSource.addEventListener('message', event => {
    if (event.data === '[DONE]') {
      eventSource.close();
      return;
    }

    try {
      if (event.data) {
        const chunk = JSON.parse(event.data);
        const newContent = chunk.choices[0]?.delta?.content || '';
        if (newContent) {
          // setMarkdownContent((prev) => prev + newContent);
          onData(newContent);
        }
      }
    } catch (error) {
      console.error('Error parsing chunk:', error);
    }
  });

  eventSource.addEventListener('error', error => {
    console.error('SSE Error:', error);
    eventSource.close();
  });
};
