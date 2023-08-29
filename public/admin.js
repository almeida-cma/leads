$(document).ready(function() {
    // Carregar usuários ao carregar a página
    function loadUsers() {
        $.ajax({
            url: "http://localhost:3000/users",
            method: "GET",
            success: function(data) {
                $('#usersTable tbody').empty();
                data.forEach(user => {
                    $('#usersTable tbody').append(`
                        <tr>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>
                                <button onclick="updateUser(${user.id})">Alterar</button>
                                <button onclick="deleteUser(${user.id})">Remover</button>
                            </td>
                        </tr>
                    `);
                });
            },
            error: function(err) {
                alert("Erro ao carregar usuários!");
                console.error("Erro ao carregar usuários: ", err);
            }
        });
    }

    // Função para abrir modal e preencher com os dados do usuário para edição
    window.updateUser = function(id) {
        let row = $(`button[onclick="updateUser(${id})"]`).closest('tr');
        let name = row.find('td:nth-child(1)').text();
        let email = row.find('td:nth-child(2)').text();

        $("#editName").val(name);
        $("#editEmail").val(email);
        $("#editId").val(id);
        $("#editModal").modal('show'); // Mostra o modal
    }

    // Função para enviar a requisição de edição ao servidor
    $("#editForm").on("submit", function(event) {
        event.preventDefault();

        const id = $("#editId").val();
        const name = $("#editName").val();
        const email = $("#editEmail").val();

        $.ajax({
            url: `http://localhost:3000/users/${id}`,
            method: "PUT",
            data: { name: name, email: email },
            success: function() {
                loadUsers();
                $("#editModal").modal('hide');
                alert("Usuário atualizado com sucesso!");
            },
            error: function(err) {
                alert("Erro ao atualizar usuário!");
                console.error("Erro ao atualizar usuário: ", err);
            }
        });
    });

    // Função para enviar a requisição de remoção ao servidor
    window.deleteUser = function(id) {
        if (confirm("Tem certeza de que deseja remover este usuário?")) {
            $.ajax({
                url: `http://localhost:3000/users/${id}`,
                method: "DELETE",
                success: function() {
                    loadUsers();
                    alert("Usuário removido com sucesso!");
                },
                error: function(err) {
                    alert("Erro ao remover usuário!");
                    console.error("Erro ao remover usuário: ", err);
                }
            });
        }
    }

    // Carregando os usuários inicialmente
    loadUsers();
});
