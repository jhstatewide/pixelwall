defmodule Pixelwall.WallServerRegistry do
  use GenServer
  require Logger

  def start_link() do
    case GenServer.start_link(__MODULE__, nil, name: :wall_server_registry) do
      {:ok, pid} -> {:ok, pid}
      {:error, {:already_started, pid}} -> {:ok, pid}
    end
  end

  def lookup(pid, wall_name) do
    GenServer.call(pid, {:lookup, wall_name})
  end

  def init(args) do
    {:ok, Map.new}
  end

  def handle_call({:lookup, name}, _from, wall_servers) do
    if wall_servers[name] do
      {:reply, wall_servers[name], wall_servers}
    else
      {:ok, wall_server} = Pixelwall.WallServer.start_link(name: name)
      # now we also want to set up a loop to save every X seconds
      wall_server |> Process.send_after(:periodic_save, Pixelwall.WallServer.save_interval)
      {:reply, wall_server, Map.put(wall_servers, name, wall_server)}
    end
  end
end
