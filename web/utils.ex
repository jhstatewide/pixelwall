defmodule Pixelwall.Utils do
  def to_integer(s) do
    if (is_integer(s)) do
      s
    else
      elem(Integer.parse(s), 0)
    end
  end
end
