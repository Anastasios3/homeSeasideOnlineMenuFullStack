class TestController < ApplicationController
  def index
    render json: { message: "Backend connection successful", status: "online" }
  end
end