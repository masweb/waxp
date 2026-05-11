import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { HumanMessage } from '@langchain/core/messages'
import { agent } from './graph.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages es requerido y debe ser un array' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const langchainMessages = messages.map(
    (m: { role: string; content: string }) => new HumanMessage(m.content)
  )

  try {
    const stream = await agent.stream(
      { messages: langchainMessages },
      { streamMode: 'messages' }
    )

    for await (const [chunk] of stream) {
      if (chunk.content && typeof chunk.content === 'string') {
        res.write(`data: ${JSON.stringify({ type: 'token', content: chunk.content })}\n\n`)
      }
      if (chunk.tool_calls?.length) {
        res.write(`data: ${JSON.stringify({ type: 'tool_calls', tools: chunk.tool_calls.map((tc: any) => tc.name) })}\n\n`)
      }
      if (chunk.name && chunk.type === 'tool') {
        res.write(`data: ${JSON.stringify({ type: 'tool_result', tool: chunk.name, content: typeof chunk.content === 'string' ? chunk.content : JSON.stringify(chunk.content) })}\n\n`)
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
  } catch (err: any) {
    console.error('Agent error:', err)
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`)
  }

  res.end()
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Agent server running on http://localhost:${PORT}`)
})
