import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
import json
import re

load_dotenv()

if not firebase_admin._apps:
    cred = credentials.Certificate('leetmento-firebase-adminsdk-fbsvc-649dd73681.json')
    firebase_admin.initialize_app(cred)
db = firestore.client()
    
def get_problem_by_name(name):
    problem_ref = db.collection('problems').where('name', '==', name).get()
    if problem_ref:
        problem = problem_ref[0].to_dict()
        instruction = problem.get('instruction', '')
        raw_examples = problem.get('examples', [])
        
        # Format examples
        formatted_examples = []
        for example in raw_examples:
            # Get raw input, output and explanation
            raw_input = example.get('input', '')
            raw_output = example.get('output', '')
            explanation = example.get('explanation', '')
            
            # Parse input (convert from string to structured object)
            input_obj = {}
            if raw_input:
                # Match variable assignments like "nums = [2,7,11,15], target = 9"
                input_parts = raw_input.split(', ')
                for part in input_parts:
                    if '=' in part:
                        var_name, var_value = part.split('=', 1)
                        var_name = var_name.strip()
                        var_value = var_value.strip()
                        
                        # Try to parse array or numeric values
                        try:
                            if var_value.startswith('[') and var_value.endswith(']'):
                                # Convert string array to actual array
                                array_str = var_value.replace('[', '').replace(']', '')
                                var_value = [int(x.strip()) for x in array_str.split(',') if x.strip()]
                            elif var_value.isdigit() or (var_value.startswith('-') and var_value[1:].isdigit()):
                                # Convert numeric strings to integers
                                var_value = int(var_value)
                        except:
                            # Keep as string if parsing fails
                            pass
                            
                        input_obj[var_name] = var_value
            
            # Parse output (convert from string to actual data type)
            output_value = raw_output
            try:
                # Check if output is a JSON array
                if raw_output.startswith('[') and raw_output.endswith(']'):
                    # Remove quotes to handle string representation
                    clean_output = raw_output.replace('"', '').replace("'", '')
                    array_str = clean_output.replace('[', '').replace(']', '')
                    output_value = [int(x.strip()) for x in array_str.split(',') if x.strip()]
                elif raw_output.isdigit() or raw_output.replace('.', '', 1).isdigit():
                    # Convert numeric strings to numbers
                    if '.' in raw_output:
                        output_value = float(raw_output)
                    else:
                        output_value = int(raw_output)
                elif raw_output.lower() in ['true', 'false']:
                    output_value = raw_output.lower() == 'true'
                elif raw_output.startswith('"') and raw_output.endswith('"'):
                    output_value = raw_output[1:-1]  # Remove quotes
            except:
                # Keep as string if parsing fails
                pass
                
            formatted_example = {
                "input": input_obj,
                "output": output_value,
                "explanation": explanation
            }
            formatted_examples.append(formatted_example)
            
        # Return formatted result
        return {
            "instruction": instruction,
            "examples": formatted_examples
        }
    else:
        return None

# Only run this test code when the file is executed directly, not when imported
if __name__ == "__main__":
    result = get_problem_by_name('Two Sum')
    print(result)