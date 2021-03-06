const { KEYS } = require("../constants")
const { apiRequest } = require("../utils/api")
const { swapKey } = require("../utils/keys")
const { setCache, getCache } = require("../utils/cache")

let positionsKey = KEYS[0]
let arrivalsKey = KEYS[1]

const get = async (req, res) => {
  // Check if this request is cached
  const cachedArrivals = getCache(`arrivals_${req.params.branch}`)
  const cachedPositions = getCache(`positions_${req.params.branch}`)
  if (cachedArrivals && cachedPositions) {
    res.json({
      response: {
        arrivals: JSON.parse(cachedArrivals),
        positions: JSON.parse(cachedPositions)
      }
    })
  } else {
    // If its not cached, make the request and cache it
    try {
      // Call endpoints
      const [arrivals, positions] = await [
        await apiRequest(req.params.branch, "arribos", arrivalsKey),
        await apiRequest(req.params.branch, "posiciones", positionsKey)
      ]

      // Swap key on arrivals error and cache response on success
      arrivals === "incorrect key"
        ? (arrivalsKey = swapKey(arrivalsKey))
        : setCache(`arrivals_${req.params.branch}`, arrivals)
      // Swap key on positions error and cache response on success
      positions === "incorrect key"
        ? (positionsKey = swapKey(positionsKey))
        : setCache(`positions_${req.params.branch}`, positions)

      // Return response
      res.json({
        response: {
          arrivals: JSON.parse(arrivals),
          positions: JSON.parse(positions)
        }
      })
    } catch (error) {
      console.log(error)
      res.status(500).send({
        error:
          "Hubo un problema obteniendo las posiciones y horarios, por favor, intente nuevamente mas tarde",
        detail: error
      })
    }
  }
}

module.exports = get
