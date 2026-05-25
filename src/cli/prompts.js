import prompts from 'prompts';

export async function askUserOptions() {
  const response = await prompts(
    [
      {
        type: 'text',
        name: 'inputPath',
        message: 'Digite o caminho do arquivo Mermaid:',
        validate: (value) => (value?.trim() ? true : 'Informe um caminho de arquivo.')
      },
      {
        type: 'select',
        name: 'exportMode',
        message: 'Escolha o modo de exportacao:',
        choices: [
          { title: 'Nodes de texto', value: 'text' },
          { title: 'File nodes (sem criar .md)', value: 'file' }
        ],
        initial: 0
      }
    ],
    {
      onCancel() {
        return false;
      }
    }
  );

  if (!response.inputPath || !response.exportMode) {
    throw new Error('Operacao cancelada.');
  }

  return {
    inputPath: response.inputPath,
    exportMode: response.exportMode
  };
}
