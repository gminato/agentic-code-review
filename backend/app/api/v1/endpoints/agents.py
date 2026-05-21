from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api import deps
from app.db.session import get_db
from app.models.agent import Agent as AgentModel
from app.schemas.agent import Agent as AgentSchema, AgentCreate, AgentUpdate
from typing import List

router = APIRouter()

@router.get("/", response_model=List[AgentSchema])
async def get_agents(
    repository_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(select(AgentModel).where(AgentModel.repository_id == repository_id))
    return result.scalars().all()

@router.post("/", response_model=AgentSchema)
async def create_agent(
    agent_in: AgentCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    agent = AgentModel(**agent_in.model_dump())
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent

@router.patch("/{agent_id}", response_model=AgentSchema)
async def update_agent(
    agent_id: int,
    agent_in: AgentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(select(AgentModel).where(AgentModel.id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    update_data = agent_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)
    
    await db.commit()
    await db.refresh(agent)
    return agent

@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(select(AgentModel).where(AgentModel.id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    await db.delete(agent)
    await db.commit()
    return {"message": "Agent deleted"}
