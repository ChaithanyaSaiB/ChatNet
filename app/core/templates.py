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

def zip_to_list(zip_object):
    return list(zip_object)

# Add the custom filter to the environment
env.filters['zip_to_list'] = zip_to_list

# Create Jinja2Templates instance with the custom environment
templates = Jinja2Templates(directory=templates_folder)
templates.env = env
