// Mock data
const squadData = {
    name: "Top Squad",
    visibility: "private",
    description: "Ranked climbs and fun weekend matches!!",
    members: ["Vivian", "Georgia", "Sam", "Kevin", "Triangle", "De", "Gus", "Player123", "Jess", "Test"],
    owners: ["Vivian", "Sam"]
};

function renderMembers() {
    const urlParams = new URLSearchParams(window.location.search);
    const squadId = urlParams.get('squad_id');
    const form = document.getElementById('manage-squad-form');
    const memberList = document.getElementById('member-list');
    const addMemberBtn = document.getElementById('add-member-btn');    
    const newMemberInput = document.getElementById('new-member');


    // Populate form
    document.getElementById('squad-name').value = squadData.name;
    document.getElementById('visibility').value = squadData.visibility;
    document.getElementById('squad-description').value = squadData.description;

    // Populate members
    memberList.innerHTML = "";
    squadData.members.forEach((member, index) => {

        const li = document.createElement("li");
        const isOwner = squadData.owners.includes(member);
        li.classList.add("member-item");

        const ownerBtnHTML = isOwner
            ? `<button type="button" class="demote-owner-btn">Demote</button>`
            : `<button type="button" class="promote-owner-btn">Promote to Owner</button>`;

        const removeBtnHTML = isOwner
            ? `<button type="button" class="remove-member-btn" disabled title="This member is an owner and cannot be removed.">Remove</button>`
            : `<button type="button" class="remove-member-btn">Remove</button>`;

        li.innerHTML = `
            <span class="member-name">${member}</span>
            <div class="member-buttons">
                ${ownerBtnHTML}
                ${removeBtnHTML}
            </div>
        `;

        memberList.appendChild(li);

        const removeBtn = li.querySelector(".remove-member-btn");
        if (!isOwner) {
            removeBtn.addEventListener("click", () => {
                squadData.members.splice(index, 1);
                squadData.owners = squadData.owners.filter(o => o !== member);
                renderMembers();
            });
        }

        const ownerBtn = li.querySelector(".promote-owner-btn, .demote-owner-btn");
        ownerBtn.addEventListener("click", () => {
            if (isOwner) {
                if (squadData.owners.length === 1) {
                    alert("You must have at least one owner.");
                    return;
                }
                squadData.owners = squadData.owners.filter(o => o !== member);
            } else {
                squadData.owners.push(member);
            }
            renderMembers();
        });
    });

    // Add member
    addMemberBtn.addEventListener('click', () => {
        const newMember = newMemberInput.value.trim();
        if (newMember) {
            const li = document.createElement("li");
            li.classList.add("member-item");
            li.innerHTML = `
                <span class="member-name">${newMember} (pending)</span>
                <button type="button" class="remove-member-btn">Remove</button> 
            `;
            memberList.appendChild(li);
            newMemberInput.value = "";
        }
    });

    // Handle form submission
    form.addEventListener('submit', e => {
        e.preventDefault();
        console.log("Saving changes...");
        // TODO: Save updates to Supabase

        renderMembers();
    });
}



// Make sure DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const deleteBtn = document.getElementById('deletesquad-btn');
    const deleteModal = document.getElementById('delete-modal');
    const cancelDelete = document.getElementById('cancel-delete');
    const confirmDelete = document.getElementById('confirm-delete');

    renderMembers();

    // Delete Confirmation modal logic
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
