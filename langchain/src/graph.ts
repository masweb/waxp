import { ChatDeepSeek } from '@langchain/deepseek'
import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph'
import { SystemMessage, AIMessage } from '@langchain/core/messages'
import { allTools } from './tools.js'

const model = new ChatDeepSeek({ model: 'deepseek-chat' })

const toolsByName = Object.fromEntries(allTools.map(t => [t.name, t]))
const modelWithTools = model.bindTools(allTools as any)

const SYSTEM_PROMPT = `Eres un asistente que gestiona sites (sitios web) de un CMS.

Tus funciones son: crear, actualizar y eliminar sites. NO listes sites al usuario.

REGLAS IMPORTANTES:
- Si el usuario pide crear un site, DEBES pedir TODOS los campos obligatorios antes de llamar a la tool:
  - name (nombre del site)
  - domain (dominio, ej: miblog.com)
  - locales (idiomas): al menos uno con código ISO 639-1 (es, en, ca, fr, de...) y marcar cuál es el default
- Si falta algún campo obligatorio, pregunta por él de forma clara y amable. NO inventes valores.
- Para actualizar o eliminar un site, SIEMPRE necesitas el ID numérico. Si el usuario te da un nombre o dominio, usa search_sites INTERNAMENTE para buscar el ID. NO digas "dime el ID", simplemente búscalo.
- NUNCA muestres JSON, IDs, datos técnicos ni resultados crudos de las tools al usuario. Responde en lenguaje natural describiendo brevemente la acción realizada.
- Responde SIEMPRE en español.
- Sé conciso y claro.`

const llmCall = async (state: any) => {
  return {
    messages: [await modelWithTools.invoke([new SystemMessage(SYSTEM_PROMPT), ...state.messages])]
  }
}

const toolNode = async (state: any) => {
  const lastMessage = state.messages.at(-1)

  if (lastMessage == null || !AIMessage.isInstance(lastMessage)) {
    return { messages: [] }
  }

  const result = []
  for (const toolCall of lastMessage.tool_calls ?? []) {
    const t = toolsByName[toolCall.name]
    if (!t) continue
    const observation = await t.invoke(toolCall)
    result.push(observation)
  }

  return { messages: result }
}

const shouldContinue = (state: any) => {
  const lastMessage = state.messages.at(-1)

  if (!lastMessage || !AIMessage.isInstance(lastMessage)) return END
  if (lastMessage.tool_calls?.length) return 'toolNode'
  return END
}

export const agent = new StateGraph(MessagesAnnotation)
  .addNode('llmCall', llmCall)
  .addNode('toolNode', toolNode)
  .addEdge(START, 'llmCall')
  .addConditionalEdges('llmCall', shouldContinue, ['toolNode', END])
  .addEdge('toolNode', 'llmCall')
  .compile()
