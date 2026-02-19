// Quick test to verify OpenAI API key works
require('dotenv').config();

async function testOpenAI() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  console.log('========================================');
  console.log('Testing OpenAI API Key');
  console.log('========================================\n');
  
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in .env file');
    process.exit(1);
  }
  
  console.log('✅ API Key found:', OPENAI_API_KEY.substring(0, 20) + '...');
  console.log('\n🔄 Making test API call to OpenAI...\n');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Say "Hello from Placement Portal!" in exactly 5 words.'
          }
        ],
        max_tokens: 20
      })
    });

    if (response.status === 401) {
      console.error('❌ Authentication failed - Invalid API key');
      console.error('   Please check your OPENAI_API_KEY in .env file');
      process.exit(1);
    }

    if (response.status === 429) {
      console.error('⚠️  Rate limited - but this means your API key is valid!');
      console.error('   Wait a moment and try again.');
      process.exit(0);
    }

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', response.status);
      console.error('   Message:', error.error?.message || 'Unknown error');
      process.exit(1);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    
    console.log('✅ SUCCESS! OpenAI API is working!\n');
    console.log('📝 Test Response:', reply);
    console.log('\n📊 Usage Stats:');
    console.log('   Prompt tokens:', data.usage?.prompt_tokens || 'N/A');
    console.log('   Completion tokens:', data.usage?.completion_tokens || 'N/A');
    console.log('   Total tokens:', data.usage?.total_tokens || 'N/A');
    console.log('\n🎉 Your Resume Builder AI is ready to use!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.error('   Check your internet connection');
    process.exit(1);
  }
}

testOpenAI();
