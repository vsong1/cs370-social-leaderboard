document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const squadId = urlParams.get('squad_id');
    const form = document.getElementById('manage-squad-form');
    const memberList = document.getElementById('member-list');
    const addMemberBtn = document.getElementById('add-member-btn');
    const newMemberInput = document.getElementById('new-member');

    // Mock data (TODO: replace with Supabase fetch)
    const squadData = {
        name: "Valorant Eagles",
        visibility: "public",
        description: "Ranked climbs and fun weekend matches!!",
        members: ["Georgia (You)", "Alex", "Sam", "Taylor"]
    };

    // Populate form
    document.getElementById('squad-name').value = squadData.name;
    document.getElementById('squad-description').value = squadData.description;

    // Populate members
    memberList.innerHTML = "";
    squadData.members.forEach((member, index) => {
        const li = document.createElement("li");
        li.classList.add("member-item");
        li.innerHTML = `
            <span class="member-name">${member}</span>
            <button type="button" class="remove-member-btn" ${member.includes("(You)") ? "disabled" : ""}>Remove</button>
        `;
        memberList.appendChild(li);
    });

    // Add member
    addMemberBtn.addEventListener('click', () => {
        const newMember = newMemberInput.value.trim();
        if (newMember) {
            const li = document.createElement("li");
            li.classList.add("member-item");
            li.innerHTML = `
                <span class="member-name">${newMember}</span>
                <button type="button" class="remove-member-btn">Remove</button>
            `;
            memberList.appendChild(li);
            newMemberInput.value = "";
        }
    });

    // Remove member
    memberList.addEventListener('click', e => {
        if (e.target.classList.contains('remove-member-btn')) {
            e.target.closest('li').remove();
        }
    });

    // Handle form submission
    form.addEventListener('submit', e => {
        e.preventDefault();
        console.log("Saving changes...");
        // TODO: Save updates to Supabase
    });

});

// Delete confirmation modal logic
    document.addEventListener('DOMContentLoaded', () => {
        const deleteBtn = document.getElementById('deletesquad-btn');
        const deleteModal = document.getElementById('delete-modal');
        const cancelDelete = document.getElementById('cancel-delete');
        const confirmDelete = document.getElementById('confirm-delete');

        deleteBtn.addEventListener('click', () => {
            deleteModal.classList.add('active');
        });

        cancelDelete.addEventListener('click', () => {
            deleteModal.classList.remove('active');
        });

        confirmDelete.addEventListener('click', async () => {
            deleteModal.classList.remove('active');

            // TODO: Replace with Supabase delete request
            console.log("Squad deleted!");
            alert("Your squad has been deleted.");
            window.location.href = 'all-squads.html';
        });
    });
