class Rack::Attack
  # Throttle all requests by IP (300 requests per 5 minutes)
  throttle("req/ip", limit: 300, period: 5.minutes) do |req|
    req.ip
  end

  # Stricter throttle on login attempts (5 per minute per IP)
  throttle("login/ip", limit: 5, period: 1.minute) do |req|
    req.ip if req.path == "/admin/login" && req.post?
  end

  # Stricter throttle on uploads (10 per minute per IP)
  throttle("uploads/ip", limit: 10, period: 1.minute) do |req|
    req.ip if req.path == "/uploads" && req.post?
  end

  # Stricter throttle on write operations (30 per minute per IP)
  throttle("writes/ip", limit: 30, period: 1.minute) do |req|
    req.ip if req.post? || req.patch? || req.put? || req.delete?
  end

  # Return 429 with JSON body
  self.throttled_responder = lambda do |_request|
    [
      429,
      { "Content-Type" => "application/json" },
      [{ error: "Too many requests. Please try again later." }.to_json]
    ]
  end
end
