import os
from fastapi.templating import Jinja2Templates
from jinja2 import Environment, FileSystemLoader

# Get the absolute path to the current file's directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Navigate up two levels to reach the parent directory
project_root = os.path.dirname(os.path.dirname(current_dir))

# Construct the absolute path to the static folder
templates_folder = os.path.join(project_root, "templates")

# Create a custom Jinja2 environment with loopcontrols extension
env = Environment(
    loader=FileSystemLoader(templates_folder),
    extensions=['jinja2.ext.loopcontrols']
)

# Create Jinja2Templates instance with the custom environment
templates = Jinja2Templates(directory=templates_folder)
templates.env = env
