export function buttonJson({nodes, edges}) {
  const data = {
    tableau1 : nodes,
    tableau2 : edges,
  };

  const fetchData = async () => {
     try {
      const response =  await fetch("https://", {
        method: "POST",
        headers: {
        "Content-Type": "application/json", // L'étiquette (on envoie du JSON)
      },
      body: JSON.stringify(data),
      });
     }
  }

  return (
    <div>
      <button onClick={fetchData
      }>
        Enregistrer l'arbre
      </button>
    </div>
  )
}
