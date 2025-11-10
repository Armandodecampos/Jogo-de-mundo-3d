
import base64

try:
    with open("Tremendous Rottis.glb", "rb") as f:
        encoded_string = base64.b64encode(f.read()).decode('utf-8')
        data_uri = f"data:application/octet-stream;base64,{encoded_string}"

        with open("gltf_base64.txt", "w") as out_file:
            out_file.write(data_uri)

        print("Arquivo 'Tremendous Rottis.glb' convertido para Base64 e salvo em 'gltf_base64.txt'")

except FileNotFoundError:
    print("Erro: O arquivo 'Tremendous Rottis.glb' não foi encontrado.")
except Exception as e:
    print(f"Ocorreu um erro: {e}")
